"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CanvasEditor } from "@/components/canvas/CanvasEditor";

export default function DrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const editorRef = useRef<{ getData: () => string; getThumbnail: () => string }>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  async function handleMint() {
    if (!title.trim()) {
      setError("Please add a title");
      return;
    }
    const data = editorRef.current?.getData();
    const thumb = editorRef.current?.getThumbnail();
    if (!data) {
      setError("Canvas is empty");
      return;
    }

    setMinting(true);
    setError("");

    const invRes = await fetch("/api/payments/mint-invoice", { method: "POST" });
    if (!invRes.ok) {
      setError("Failed to create payment");
      setMinting(false);
      return;
    }
    const invData = await invRes.json();
    setPaymentHash(invData.paymentHash);
    setInvoice(invData.invoice);
    setPaymentStatus("PENDING");

    const poll = setInterval(async () => {
      const checkRes = await fetch(`/api/payments/check?paymentHash=${invData.paymentHash}`);
      const checkData = await checkRes.json();
      if (checkData.paid) {
        clearInterval(poll);
        setPaymentStatus("COMPLETE");

        const saveRes = await fetch("/api/drawings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            canvasData: data,
            thumbnail: thumb,
            paymentHash: invData.paymentHash,
          }),
        });

        if (saveRes.ok) {
          const drawing = await saveRes.json();
          setSavedId(drawing.id);
        } else {
          setError("Failed to save drawing");
        }
      }
    }, 2000);

    setTimeout(() => clearInterval(poll), 60000);
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">Loading...</div>;
  }

  if (savedId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="rounded-full bg-green-600/20 p-4">
          <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Drawing Minted!</h2>
        <p className="text-zinc-400">Your artwork is now on the platform.</p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/drawing/${savedId}`)}
            className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            View Drawing
          </button>
          <button
            onClick={() => router.push(`/auction/create/${savedId}`)}
            className="rounded-lg border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
          >
            Start Auction
          </button>
          <button
            onClick={() => router.push("/draw")}
            className="rounded-lg border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
          >
            Draw Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create a Drawing</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Drawing title..."
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm w-64 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
        <CanvasEditor ref={editorRef} />
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none h-20"
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          {paymentStatus === "PENDING" && invoice && (
            <div className="rounded-lg border border-amber-600/30 bg-amber-600/10 px-4 py-2 text-center">
              <p className="text-xs text-amber-400 mb-1">Waiting for payment...</p>
              <code className="text-xs text-zinc-500 break-all">{invoice.slice(0, 40)}...</code>
              <p className="text-xs text-zinc-500 mt-1">Auto-confirms in ~8s (mock)</p>
            </div>
          )}
          {!paymentStatus && (
            <button
              onClick={handleMint}
              disabled={minting}
              className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              {minting ? "Creating invoice..." : "Mint for 100 SATS"}
            </button>
          )}
          {paymentStatus === "PENDING" && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              Processing payment...
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
