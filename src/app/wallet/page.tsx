import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [payments, bids] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        drawing: { select: { id: true, title: true } },
        bid: { select: { auctionId: true } },
      },
    }),
    prisma.bid.findMany({
      where: { bidderId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        auction: {
          select: {
            id: true,
            status: true,
            currentBid: true,
            drawing: { select: { id: true, title: true } },
          },
        },
      },
    }),
  ]);

  const totalSpent = payments
    .filter((p) => p.status === "COMPLETE")
    .reduce((sum, p) => sum + p.amountSats, 0);

  const wonAuctions = await prisma.auction.count({
    where: { winnerId: session.user.id, status: "ENDED" },
  });

  const totalEarned = payments
    .filter((p) => p.type === "PAYOUT" && p.status === "COMPLETE")
    .reduce((sum, p) => sum + p.amountSats, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Total Spent</p>
          <p className="text-xl font-bold text-amber-500">{totalSpent.toLocaleString()} SATS</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Total Earned</p>
          <p className="text-xl font-bold text-green-500">{totalEarned.toLocaleString()} SATS</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Auctions Won</p>
          <p className="text-xl font-bold text-zinc-100">{wonAuctions}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      payment.status === "COMPLETE"
                        ? "bg-green-500"
                        : payment.status === "FAILED"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium capitalize">{payment.type.toLowerCase()}</p>
                    <p className="text-xs text-zinc-500">
                      {payment.drawing?.title || payment.description || ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    payment.type === "PAYOUT" ? "text-green-500" : "text-amber-500"
                  }`}
                >
                  {payment.type === "PAYOUT" ? "+" : "-"}
                  {payment.amountSats.toLocaleString()} SATS
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">My Bids</h2>
        {bids.length === 0 ? (
          <p className="text-sm text-zinc-500">No bids placed yet.</p>
        ) : (
          <div className="space-y-2">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm">{bid.auction.drawing.title}</p>
                  <p className="text-xs text-zinc-500">
                    Status: {bid.auction.status}
                  </p>
                </div>
                <span className="text-sm font-medium text-amber-500">
                  {bid.amount.toLocaleString()} SATS
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
