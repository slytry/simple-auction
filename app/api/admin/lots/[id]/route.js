import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServer";
import { ADMIN_COOKIE_NAME } from "../../../../../lib/adminAuth";

function normalizeString(value) {
  return String(value || "").trim();
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== "1") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createSupabaseServerClient();

  if (body.action === "close") {
    const { data, error } = await supabase
      .from("lots")
      .update({ end_time: new Date().toISOString() })
      .eq("id", id)
      .select("id, title, slug, image_url, avito_link, current_price, min_step, delivery_price, end_time")
      .single();

    if (error) {
      return NextResponse.json({ error: "Не удалось закрыть лот" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lot: data });
  }

  const title = normalizeString(body.title);
  const imageUrl = normalizeString(body.image_url);
  const avitoLink = normalizeString(body.avito_link);
  const minStep = parseNumber(body.min_step);
  const deliveryPrice = parseNumber(body.delivery_price);
  const endTime = new Date(body.end_time);

  if (!title) return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  if (!imageUrl) return NextResponse.json({ error: "Ссылка на изображение обязательна" }, { status: 400 });
  if (!avitoLink) return NextResponse.json({ error: "Ссылка на Avito обязательна" }, { status: 400 });
  if (!Number.isFinite(minStep) || minStep <= 0) {
    return NextResponse.json({ error: "Минимальный шаг должен быть > 0" }, { status: 400 });
  }
  if (!Number.isFinite(deliveryPrice) || deliveryPrice < 0) {
    return NextResponse.json({ error: "Цена доставки должна быть >= 0" }, { status: 400 });
  }
  if (Number.isNaN(endTime.getTime())) {
    return NextResponse.json({ error: "Некорректное время окончания" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lots")
    .update({
      title,
      image_url: imageUrl,
      avito_link: avitoLink,
      min_step: minStep,
      delivery_price: deliveryPrice,
      end_time: endTime.toISOString()
    })
    .eq("id", id)
    .select("id, title, slug, image_url, avito_link, current_price, min_step, delivery_price, end_time")
    .single();

  if (error) {
    return NextResponse.json({ error: "Не удалось обновить лот" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lot: data });
}
