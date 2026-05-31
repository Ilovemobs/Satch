import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DrawingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const drawing = await prisma.drawing.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true } },
      auction: {
        include: {
          _count: { select: { bids: true } },
        },
      },
    },
  });

  if (!drawing) notFound();

  const isOwner = session?.user?.id === drawing.ownerId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="aspect-[4/3] bg-zinc-800 flex items-center justify-center">
          {drawing.thumbnail ? (
            <img src={drawing.thumbnail} alt={drawing.title} className="object-contain w-full h-full" />
          ) : (
            <div className="p-8 text-center">
              <p className="text-zinc-500">Canvas preview not available</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{drawing.title}</h1>
            <Link
              href={`/profile/${drawing.owner.id}`}
              className="text-sm text-zinc-400 hover:text-amber-500 transition-colors"
            >
              by {drawing.owner.username}
            </Link>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-500">Status</span>
            {drawing.auction ? (
              <p className="text-sm font-medium text-amber-500">
                {drawing.auction.status === "ACTIVE" ? "On Auction" : drawing.auction.status}
              </p>
            ) : (
              <p className="text-sm font-medium text-zinc-400">Minted</p>
            )}
          </div>
        </div>

        {drawing.description && (
          <p className="text-sm text-zinc-400">{drawing.description}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {drawing.auction?.status === "ACTIVE" && (
            <Link
              href={`/auction/${drawing.auction.id}`}
              className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
            >
              View Auction
            </Link>
          )}
          {isOwner && !drawing.auction && (
            <Link
              href={`/auction/create/${drawing.id}`}
              className="rounded-lg border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              Start Auction
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
