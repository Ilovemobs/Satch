"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateAuctionForm({
  drawingId,
  title,
}: {
  drawingId: string;
  title: string;
}) {
  const router = useRouter();
  const [startingBid, setStartingBid] = useState(100);
  const [durationHours, setDurationHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auctions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawingId, startingBid, durationHours }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create auction");
      setLoading(false);
      return;
    }

    const auction = await res.json();
    router.push(`/auction/${auction.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Starting Bid (SATS)</label>
        <input
          type="number"
          value={startingBid}
          onChange={(e) => setStartingBid(parseInt(e.target.value) || 0)}
          min={1}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Duration (hours)</label>
        <select
          value={durationHours}
          onChange={(e) => setDurationHours(parseInt(e.target.value))}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value={1}>1 hour</option>
          <option value={6}>6 hours</option>
          <option value={12}>12 hours</option>
          <option value={24}>24 hours</option>
          <option value={48}>48 hours</option>
          <option value={72}>72 hours (3 days)</option>
          <option value={168}>7 days</option>
        </select>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
        Platform fee: <span className="text-zinc-300">5%</span> of final sale price
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Creating auction..." : "Start Auction"}
      </button>
    </form>
  );
}
