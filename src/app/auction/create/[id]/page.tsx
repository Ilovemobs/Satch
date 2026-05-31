import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CreateAuctionForm } from "./CreateAuctionForm";

export const dynamic = "force-dynamic";

export default async function CreateAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const drawing = await prisma.drawing.findUnique({
    where: { id },
    include: { auction: true },
  });

  if (!drawing) notFound();
  if (drawing.ownerId !== session.user.id) redirect("/");
  if (drawing.auction) redirect(`/auction/${drawing.auction.id}`);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Start Auction</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Sell &ldquo;{drawing.title}&rdquo; to the highest bidder
        </p>
      </div>

      <CreateAuctionForm drawingId={id} title={drawing.title} />
    </div>
  );
}
