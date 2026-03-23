import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServer";

function normalizeName(value) {
  return String(value || "")
    .trim()
    .slice(0, 40);
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json();
  const name = normalizeName(body.name);
  const amount = Number(body.amount);

  if (!name) {
    return NextResponse.json({ error: "Введите имя" }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Некорректная сумма ставки" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("place_bid", {
    p_slug: slug,
    p_name: name,
    p_amount: amount
  });

  if (error) {
    const messageMap = {
      LOT_NOT_FOUND: "Лот не найден",
      AUCTION_ENDED: "Аукцион уже завершен",
      BID_TOO_LOW: "Ставка слишком низкая"
    };

    const status =
      error.message === "LOT_NOT_FOUND"
        ? 404
        : ["AUCTION_ENDED", "BID_TOO_LOW"].includes(error.message)
          ? 400
          : 500;

    return NextResponse.json({ error: messageMap[error.message] || "Ошибка сервера" }, { status });
  }

  return NextResponse.json({ ok: true, result: data?.[0] || null });
}
