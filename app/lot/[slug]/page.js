import { notFound } from "next/navigation";
import AuctionClient from "../../../components/AuctionClient";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function LotPage({ params }) {
  const supabase = createSupabaseServerClient();
  const { slug } = await params;

  const { data: lot, error: lotError } = await supabase
    .from("lots")
    .select("*")
    .eq("slug", slug)
    .single();

  if (lotError || !lot) {
    notFound();
  }

  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("lot_id", lot.id)
    .order("amount", { ascending: false })
    .order("created_at", { ascending: false });

  if (bidsError) {
    throw new Error(bidsError.message);
  }

  return (
    <main className="container">
      <AuctionClient initialLot={lot} initialBids={bids || []} initialNowMs={Date.now()} />
    </main>
  );
}
