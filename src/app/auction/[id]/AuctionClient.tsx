"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatSats, getTimeRemaining } from "@/lib/utils";

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  bidder: { id: string; username: string };
}

interface Auction {
  id: string;
  startingBid: number;
  currentBid: number;
  minBidIncrement: number;
  endTime: string;
  status: string;
  seller: { id: string; username: string };
  winner: { id: string; username: string } | null;
  drawing: { id: string; title: string; description: string; thumbnail: string | null };
  bids: Bid[];
}

export function AuctionClient({
  auction,
  userId,
  isSeller,
  ended,
}: {
  auction: Auction;
  userId: string | null;
  isSeller: boolean;
  ended: boolean;
}) {
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState(auction.currentBid + auction.minBidIncrement);
  const [timeLeft, setTimeLeft] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState("");
  const [invoice, setInvoice] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [bids, setBids] = useState(auction.bids);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(new Date(auction.endTime)));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const refreshBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/auctions/${auction.id}`);
      const data = await res.json();
      if (data.bids) setBids(data.bids);
    } catch {}
  }, [auction.id]);

  useEffect(() => {
    const interval = setInterval(refreshBids, 5000);
    return () => clearInterval(interval);
  }, [refreshBids]);

  async function handleBid() {
    if (!userId) {
      router.push("/auth/login");
      return;
    }

    setBidding(true);
    setBidError("");

    const res = await fetch(`/api/auctions/${auction.id}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: bidAmount }),
    });

    const data = await res.json();

    if (!res.ok) {
      setBidError(data.error || "Bid failed");
      setBidding(false);
      return;
    }

    setInvoice(data.invoice);
    setPaymentStatus("PENDING");

    const poll = setInterval(async () => {
      const checkRes = await fetch(`/api/payments/check?paymentHash=${data.paymentHash}`);
      const checkData = await checkRes.json();
      if (checkData.paid) {
        clearInterval(poll);
        setPaymentStatus("COMPLETE");
        setBidding(false);
        refreshBids();
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(poll);
      setBidding(false);
    }, 30000);
  }

  const minBid = auction.currentBid + auction.minBidIncrement;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/drawing/${auction.drawing.id}`}
          className="text-lg font-bold hover:text-amber-500 transition-colors"
        >
          {auction.drawing.title}
        </Link>
        <p className="text-sm text-zinc-500">
          by{" "}
          <Link href={`/profile/${auction.seller.id}`} className="hover:text-amber-500">
            {auction.seller.username}
          </Link>
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Current Bid</span>
          <span className="text-2xl font-bold text-amber-500">{formatSats(auction.currentBid)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Time Left</span>
          <span className={`text-sm font-medium ${ended ? "text-red-500" : "text-zinc-100"}`}>
            {ended ? "Ended" : timeLeft}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Starting Bid</span>
          <span className="text-sm text-zinc-400">{formatSats(auction.startingBid)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Total Bids</span>
          <span className="text-sm text-zinc-400">{bids.length}</span>
        </div>
      </div>

      {ended && auction.winner && (
        <div className="rounded-xl border border-green-800 bg-green-900/20 p-4 text-center">
          <p className="text-sm text-green-400">
            Won by <span className="font-semibold">{auction.winner.username}</span>
          </p>
        </div>
      )}

      {ended && !auction.winner && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-sm text-zinc-500">No bids were placed</p>
        </div>
      )}

      {!ended && !isSeller && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
              min={minBid}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
            <span className="text-xs text-zinc-500">SATS</span>
          </div>
          {bidError && <p className="text-sm text-red-500">{bidError}</p>}
          {invoice && paymentStatus === "PENDING" && (
            <div className="rounded-lg border border-amber-600/30 bg-amber-600/10 p-3 text-center">
              <p className="text-xs text-amber-400 mb-1">Processing payment...</p>
              <code className="text-xs text-zinc-500 break-all">{invoice.slice(0, 30)}...</code>
            </div>
          )}
          {!paymentStatus && (
            <button
              onClick={handleBid}
              disabled={bidding || !!userId === false}
              className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              {!userId ? "Sign In to Bid" : bidding ? "Processing..." : `Place Bid (${formatSats(bidAmount)})`}
            </button>
          )}
          <p className="text-xs text-zinc-600 text-center">
            Minimum bid: {formatSats(minBid)} · Auto-confirms in ~8s (mock)
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Bid History</h3>
        {bids.length === 0 ? (
          <p className="text-sm text-zinc-600">No bids yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-2"
              >
                <div>
                  <span className="text-sm text-zinc-100">{bid.bidder.username}</span>
                </div>
                <span className="text-sm font-medium text-amber-500">{formatSats(bid.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
